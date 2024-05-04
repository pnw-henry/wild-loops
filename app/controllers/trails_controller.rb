#S3 bucket setup
$s3_client = Aws::S3::Client.new
$bucket_name = "wild-loops"
$presigner = Aws::S3::Presigner.new(client: $s3_client)
$trail_objects = $s3_client.list_objects_v2(bucket: $bucket_name, prefix: "trails/").contents
$image_keys = $trail_objects.map { |obj| [File.basename(obj.key, ".*"), obj.key] }.to_h

class TrailsController < ApplicationController
  include ActionController::MimeResponds

  rescue_from ActiveRecord::RecordInvalid, with: :render_unprocessable_entity_response
  rescue_from ActiveRecord::RecordNotFound, with: :render_not_found_response


  def index
      trails = Trail.all
      trails_with_images = trails.map do |trail|
        image_key = $image_keys[trail.name]
        image_url = image_key ? $presigner.presigned_url(:get_object, bucket: $bucket_name, key: image_key, expires_in: 604800) : nil
        trail.as_json(include: [:reports]).merge(image_url: image_url)
      end

    if request.format.json?
      render json: trails_with_images
    else
      file_path = Rails.root.join('public', 'index.html')
        if File.exist?(file_path)
          send_file(file_path, type: 'text/html', disposition: 'inline')
        else
          raise ActionController::RoutingError, 'Not Found'
        end
    end
  end

  def show
    trail = find_trail
    image_key = $image_keys[trail.name]
    image_url = image_key ? $presigner.presigned_url(:get_object, bucket: $bucket_name, key: image_key, expires_in: 604800) : nil
    trail = trail.as_json(include: [:reports]).merge(image_url: image_url)
    render json: trail
  end

  def update
    trail = find_trail
    user = find_user
    if (user.id != 1)
      return render json: {error: "You are not authorized to edit this trail"}, status: :unauthorized
    else
      trail.update!(trail_params)
      render json: trail, status: :ok
    end
  end

  def home_image

    home_objects = $s3_client.list_objects_v2(bucket: $bucket_name, prefix: "home/").contents
    main_home_object = home_objects.find { |obj| obj.key.include?("main") }
    login_home_object = home_objects.find { |obj| obj.key.include?("login") }

    if main_home_object
        home_image_url = $presigner.presigned_url(:get_object, bucket: $bucket_name, key: main_home_object.key, expires_in: 604800)
        login_image_url = $presigner.presigned_url(:get_object, bucket: $bucket_name, key: login_home_object.key, expires_in: 3600)
        render json: { home_image_url: home_image_url, login_image_url: login_image_url }
    else
        render json: { error: "Main home image not found" }, status: :not_found
    end
  end
  
  private

  def set_s3_bucket
    @bucket_name = "wild-loops"
  end

  def presigned_url_for(trail_name)
    object = fetch_image_object(trail_name)
    object ? presigned_url(object.key) : nil
  end

  def fetch_image_object(trail_name)
    $s3_client.list_objects_v2(bucket: @bucket_name, prefix: "trails/#{trail_name}").contents.first
  end

  def presigned_url(key)
    $presigner.presigned_url(:get_object, bucket: @bucket_name, key: key, expires_in: 604800)
  end

  def fetch_home_images
    home_objects = $s3_client.list_objects_v2(bucket: @bucket_name, prefix: "home/").contents
    [home_objects.find { |obj| obj.key.include?("main") }, home_objects.find { |obj| obj.key.include?("login") }]
  end

  def serve_html_file
    file_path = Rails.root.join('public', 'index.html')
    if File.exist?(file_path)
      send_file(file_path, type: 'text/html', disposition: 'inline')
    else
      raise ActionController::RoutingError, 'Not Found'
    end
  end

  def authorized_user?
    user = find_user
    user.id == 1
  end

  def find_trail
    Trail.find(params[:id])
  end

  def trail_params
    params.permit(:name, :location, :length, :elevation_gain, :highest_point, :difficulty, :dogs, :pass, :summary, :image_url, :latitude, :longitude, :place_id)
  end

  def find_user
    User.find(session[:user_id])
  end

  def render_unprocessable_entity_response(exception)
    render json: {errors: exception.record.errors.full_messages}, status: :unprocessable_entity
  end

  def render_not_found_response
    render json: { error: "Trail not found" }, status: :not_found
  end
end

